import { Component, OnInit } from '@angular/core';
import { PaymentService } from '../../services/payment.service';
import { Payment } from '../../interfaces/payment.interface';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { PatientService } from '../../services/patient.service';
import { AppointmentService } from '../../services/appointment.service';
import { Appointment } from '../../interfaces/appointment.interface';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Treatment, TreatmentService } from '../../services/treatment.service';
import { forkJoin } from 'rxjs';
import { MedicalAttentionService } from '../../services/medical-attention.service';

@Component({
  selector: 'app-payment',
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CurrencyPipe,
    DatePipe
  ]
})
export class PaymentComponent implements OnInit {
  payments: Payment[] = [];
  paymentForm: FormGroup;
  patients: any[] = [];
  appointments: Appointment[] = [];
  editingPaymentId: number | null = null;
  treatments: Treatment[] = [];
  otherTreatments: any[] = [];
  attentionTreatments: any[] = [];
  treatmentsDisplay: string = '';
  selectedAttentionTotal: number | null = null;

  constructor(
    private fb: FormBuilder,
    private paymentService: PaymentService,
    private patientService: PatientService,
    private appointmentService: AppointmentService,
    private treatmentService: TreatmentService,
    private medicalAttentionService: MedicalAttentionService
  ) {
    this.paymentForm = this.fb.group({
      patient_id: ['', [Validators.required]],
      appointment_id: ['', [Validators.required]],
      amount: ['', [Validators.required]],
      date: ['', [Validators.required]],
      method: ['Efectivo', [Validators.required]],
    });
  }

  ngOnInit() {
    console.log('PaymentComponent initialized');

    forkJoin({
      payments: this.paymentService.getPayments(),
      patients: this.patientService.getPatients(),
      appointments: this.appointmentService.getAppointments(),
      treatments: this.treatmentService.getAll()
    }).subscribe({
      next: ({ payments, patients, appointments, treatments }) => {
        console.log('Datos recibidos:');
        console.log('Pagos:', payments);
        console.log('Pacientes:', patients);
        console.log('Citas:', appointments);
        console.log('Tratamientos:', treatments);

        this.patients = patients;
        this.appointments = (appointments ?? []).filter(app => this.isAttendedAppointment(app));
        this.treatments = treatments;

        this.payments = payments.map((p: Payment): Payment => {
          const treatment = p.treatmentId ? this.treatments.find(t => t.id === p.treatmentId) : undefined;
          console.log(`Mapeando pago ID ${p.id}: treatmentId=${p.treatmentId}, treatment=`, treatment);

          // Enriquecer tratamientos del pago con datos de descuento si es necesario
          const enrichedTreatments = p.treatments?.map(pt => {
            const fullTreatment = this.treatments.find(t => t.id === pt.id);
            return fullTreatment ? {
              ...pt,
              precio_original: fullTreatment.precio,
              tiene_descuento: fullTreatment.tiene_descuento ?? Boolean(fullTreatment.precio_con_descuento && fullTreatment.precio_con_descuento !== fullTreatment.precio),
              precio_con_descuento: fullTreatment.precio_con_descuento ?? fullTreatment.precio,
              ahorro: fullTreatment.ahorro ?? (fullTreatment.precio_con_descuento ? fullTreatment.precio - fullTreatment.precio_con_descuento : 0)
            } : pt;
          }) ?? [];

          return {
            ...p,
            treatment: treatment ? { id: treatment.id!, nombre: treatment.nombre } : undefined,
            treatments: enrichedTreatments
          };
        });
      },
      error: (err) => console.error('Error cargando datos iniciales:', err)
    });

    this.paymentForm.get('patient_id')?.valueChanges.subscribe(patientId => {
      console.log('Paciente seleccionado:', patientId);
      if (patientId) {
        this.appointmentService.getAppointmentsByPatient(patientId).subscribe({
          next: (data) => {
            console.log(`Citas del paciente ${patientId}:`, data);
            const filtered = (data ?? []).filter(app => this.isAttendedAppointment(app));
            this.appointments = filtered;
          },
          error: (err) => console.error(`Error cargando citas para paciente ${patientId}:`, err)
        });
      } else {
        console.log('No se seleccionó paciente, limpiando citas');
        this.attentionTreatments = [];
        this.otherTreatments = [];
        this.selectedAttentionTotal = null;
        this.paymentForm.patchValue({ appointment_id: '' });
      }
    });

    this.paymentForm.get('appointment_id')?.valueChanges.subscribe(appointmentId => {
      console.log('Cita seleccionada en Payment:', appointmentId);
      if (appointmentId) {
        this.loadMedicalAttentionByAppointment(Number(appointmentId));
      } else {
        this.applyAttentionData(null);
      }
    });
  }

  private isAttendedAppointment(appointment: any): boolean {
    if (!appointment) {
      return false;
    }
    const status = (appointment.status ?? appointment.appointment_status ?? '').toString().toLowerCase();
    const payment_status = appointment.payment_status ?? 'Pendiente';
    return status === 'attended' && payment_status !== 'Pagado';
  }

  private setFormValues(payment: Payment) {
    this.paymentForm.setValue({
      patient_id: payment.patientId,
      appointment_id: payment.appointmentId,
      amount: payment.amount,
      date: payment.date,
      method: payment.method,
    });
  }

  getFinalPrice(treatment: any): string {
    if (!treatment || !treatment.precio_con_descuento) return treatment?.precio || '0';
    return treatment.precio_con_descuento.toString();
  }

  editPayment(payment: Payment) {
    console.log('Editar pago:', payment);
    this.editingPaymentId = payment.id;

    this.appointmentService.getAppointmentsByPatient(payment.patientId).subscribe({
      next: (appointments) => {
        const filtered = (appointments ?? []).filter(app => this.isAttendedAppointment(app));
        if (payment.appointmentId && !filtered.some(app => app.id === payment.appointmentId)) {
          const derivedAppointment = this.buildAppointmentFromPayment(payment);
          if (derivedAppointment) {
            filtered.push(derivedAppointment);
          }
        }
        this.appointments = filtered;

        const pacienteExiste = this.patients.some(p => p.id === payment.patientId);
        if (!pacienteExiste && payment.patient) {
          this.patients.push(payment.patient);
        }

        this.setFormValues(payment);
        this.loadMedicalAttentionByAppointment(payment.appointmentId, { forceAmount: false, forceTreatment: false });
      },
      error: (err) => console.error('Error cargando citas del paciente:', err)
    });
  }

  deletePayment(id: number) {
    console.log('Eliminar pago ID:', id);
    this.paymentService.deletePayment(id).subscribe({
      next: () => {
        console.log(`Pago ${id} eliminado`);
        this.payments = this.payments.filter(p => p.id !== id);
      },
      error: (err) => console.error(`Error eliminando pago ${id}:`, err)
    });
  }

  onSubmit() {
    if (this.paymentForm.valid) {
      const formValue = this.paymentForm.getRawValue();
      const payload = {
        ...formValue,
        treatment_ids: this.attentionTreatments.map(t => t.id) || [],
        other_treatments: this.otherTreatments || [],
        status: this.editingPaymentId ? undefined : 'Pagado',
      };

      if (this.editingPaymentId) {
        this.paymentService.updatePayment(this.editingPaymentId, payload as any).subscribe({
          next: (updated: any) => {
            console.log('Pago actualizado:', updated);
            updated.amount = Number(updated.amount);

            // Enriquecer el pago actualizado con tratamientos completos
            const enrichedUpdated = this.enrichPayment(updated);
            this.payments = this.payments.map(p => p.id === enrichedUpdated.id ? enrichedUpdated : p);
            this.resetForm();
          },
          error: (err) => console.error('Error actualizando pago:', err)
        });
      } else {
        this.paymentService.createPayment(payload).subscribe({
          next: (created: any) => {
            console.log('Pago creado:', created);
            created.amount = Number(created.amount);

            // Enriquecer el pago creado con tratamientos completos
            const enrichedCreated = this.enrichPayment(created);
            this.payments.push(enrichedCreated);
            this.resetForm();
          },
          error: (err) => console.error('Error creando pago:', err)
        });
      }
    } else {
      console.warn('Formulario inválido:', this.paymentForm.value);
    }
  }

  private enrichPayment(payment: any): any {
    // Enriquecer tratamientos del pago con datos de descuento
    const enrichedTreatments = payment.treatments?.map((pt: any) => {
      const fullTreatment = this.treatments.find(t => t.id === pt.id);
      return fullTreatment ? {
        ...pt,
        precio_original: fullTreatment.precio,
        tiene_descuento: fullTreatment.tiene_descuento ?? Boolean(fullTreatment.precio_con_descuento && fullTreatment.precio_con_descuento !== fullTreatment.precio),
        precio_con_descuento: fullTreatment.precio_con_descuento ?? fullTreatment.precio,
        ahorro: fullTreatment.ahorro ?? (fullTreatment.precio_con_descuento ? fullTreatment.precio - fullTreatment.precio_con_descuento : 0)
      } : pt;
    }) ?? [];

    return {
      ...payment,
      treatments: enrichedTreatments
    };
  }

  getPagoClass(payment: Payment): string {
    if (!payment.appointment?.date || !payment.date) return '';

    const fechaCita = new Date(payment.appointment.date);
    const fechaPago = new Date(payment.date);

    return fechaPago > fechaCita ? 'text-danger' : 'text-muted';
  }

  resetForm() {
    this.paymentForm.reset({
      method: 'Efectivo'
    });
    this.editingPaymentId = null;
    this.treatmentsDisplay = '';
    this.attentionTreatments = [];
    this.otherTreatments = [];
    this.selectedAttentionTotal = null;
  }

  loadMedicalAttentionByAppointment(appointmentId: number, options: { forceAmount?: boolean, forceTreatment?: boolean } = {}): void {
    if (!appointmentId) {
      console.warn('No se seleccionó una cita válida.');
      this.applyAttentionData(null, options);
      return;
    }

    // Primero obtener la atención médica
    this.medicalAttentionService.getMedicalAttentionByAppointment(appointmentId).subscribe({
      next: (attention: any) => {
        console.log('Atención médica recibida:', attention);

        // Enriquecer tratamientos con datos de descuento desde el servicio de tratamientos
        this.treatmentService.getAll().subscribe({
          next: (allTreatments) => {
            const enrichedAttention = {
              ...attention,
              treatments: attention.treatments?.map((treatment: any) => {
                // Buscar el tratamiento completo para obtener datos de descuento
                const fullTreatment = allTreatments.find(t => t.id === treatment.id);
                return {
                  ...treatment,
                  precio_original: fullTreatment?.precio ?? treatment.precio,
                  tiene_descuento: fullTreatment?.tiene_descuento ?? Boolean(fullTreatment?.precio_con_descuento && fullTreatment.precio_con_descuento !== fullTreatment.precio),
                  precio_con_descuento: fullTreatment?.precio_con_descuento ?? fullTreatment?.precio ?? treatment.precio,
                  ahorro: fullTreatment?.ahorro ?? (fullTreatment?.precio_con_descuento ? (fullTreatment.precio - fullTreatment.precio_con_descuento) : 0),
                };
              }) ?? []
            };

            // Recalcular el total_cost basado en precios finales
            const totalCost = this.calculateTotalCost(enrichedAttention);
            enrichedAttention.total_cost = totalCost;

            console.log('Atención médica enriquecida:', enrichedAttention);
            this.applyAttentionData(enrichedAttention, options);
          },
          error: (treatmentsErr) => {
            console.warn('Error al cargar tratamientos completos, usando datos básicos:', treatmentsErr);
            this.applyAttentionData(attention, options);
          }
        });
      },
      error: (err: any) => {
        console.error('Error al cargar la atención médica:', err);
        this.applyAttentionData(null, options);
      }
    });
  }

  private calculateTotalCost(attention: any): number {
    let total = 0;

    // Suma precio final de tratamientos
    if (attention.treatments && attention.treatments.length > 0) {
      total += attention.treatments.reduce((sum: number, treatment: any) => {
        const precioFinal = treatment?.precio_con_descuento ?? treatment?.precio ?? 0;
        return sum + precioFinal;
      }, 0);
    }

    // Suma otros tratamientos
    if (attention.other_treatments && attention.other_treatments.length > 0) {
      total += attention.other_treatments.reduce((sum: number, other: any) => {
        return sum + (Number(other.price) || 0);
      }, 0);
    }

    return total;
  }

  private applyAttentionData(attention: any | null, options: { forceAmount?: boolean, forceTreatment?: boolean } = {}): void {
    const { forceAmount = true, forceTreatment = true } = options;
    if (attention) {
      this.attentionTreatments = Array.isArray(attention.treatments) ? [...attention.treatments] : [];
      this.otherTreatments = Array.isArray(attention.other_treatments) ? [...attention.other_treatments] : [];
      const total = Number(attention.total_cost ?? 0);
      this.selectedAttentionTotal = total;
      const treatmentsList = this.attentionTreatments.map(t => `${t.nombre} - $${this.getFinalPrice(t)}`);
      const otherList = this.otherTreatments.map(ot => `${ot.name} - $${ot.price}`);
      this.treatmentsDisplay = [...treatmentsList, ...otherList].join(', ');

      if (forceAmount) {
        this.paymentForm.get('amount')?.setValue(total, { emitEvent: false });
      }
    } else {
      this.attentionTreatments = [];
      this.otherTreatments = [];
      this.treatmentsDisplay = '';
      this.selectedAttentionTotal = null;
      if (forceAmount) {
        this.paymentForm.get('amount')?.setValue('', { emitEvent: false });
      }
    }
  }

  private buildAppointmentFromPayment(payment: Payment): Appointment | null {
    if (!payment.appointmentId) {
      return null;
    }

    const base = (payment.appointment ?? {}) as any;

    const derived: Appointment = {
      id: payment.appointmentId,
      patient_id: payment.patientId,
      patient_name: payment.patient?.name ?? '',
      ci: null,
      doctor_id: base?.doctor_id ?? base?.doctor?.id ?? null,
      doctor: base?.doctor ?? null,
      doctor_name: base?.doctor_name ?? '',
      doctor_specialty: base?.doctor_specialty ?? null,
      date: base?.date ?? '',
      time: base?.time ?? '',
      reason: base?.reason ?? '',
      payment_status: base?.payment_status ?? payment.status ?? 'Pendiente',
      status: base?.status ?? 'attended'
    } as Appointment;

    return derived;
  }

  getTreatmentNames(payment: Payment): string {
    const normal = (payment.treatments || []).map((t: any) => t.nombre).join(', ');
    const others = (payment.other_treatments || []).map((o: any) => o.name).join(', ');
    return [normal, others].filter(Boolean).join(', ') || 'Sin tratamientos';
  }

  exportToPDF() {
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text('Lista de Pagos', 14, 20);

    const rows = this.payments.map(p => [
      p.id,
      p.patient?.name || 'Sin paciente',
      p.appointment?.date || 'Sin cita',
      this.getTreatmentNames(p),
      p.appointment?.doctor_name || 'No registrado',
      p.date,
      p.amount,
      p.method
    ]);

    autoTable(doc, {
      head: [['ID', 'Paciente', 'Fecha Cita', 'Tratamiento', 'Medico', 'Fecha Pago', 'Monto', 'Método']],
      body: rows,
      startY: 30
    });

    doc.save('pagos.pdf');
  }

  exportComprobante(payment: Payment) {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('COMPROBANTE DE PAGO', 70, 20);
    doc.setLineWidth(0.5);
    doc.line(15, 25, 195, 25);

    doc.setFontSize(12);
    doc.text(`Fecha de emisión: ${new Date().toLocaleDateString()}`, 15, 35);
    doc.text(`Paciente: ${payment.patient?.name || 'No especificado'}`, 15, 45);
    doc.text(`Cita: ${payment.appointment?.date ? new Date(payment.appointment.date).toLocaleDateString() : 'Sin fecha'}`, 15, 55);
    doc.text(`Médico: ${payment.appointment?.doctor_name || 'No registrado'}`, 15, 65);

    let y = 80;
    doc.setFontSize(14);
    doc.text('Tratamientos Realizados:', 15, y);
    y += 5;

    let totalTreatments: number = 0;
    if (payment.treatments && payment.treatments.length > 0) {
      const treatmentsData = payment.treatments.map(t => {
        const precioFinal = t.precio_con_descuento ?? t.precio ?? 0;
        totalTreatments += precioFinal;
        return [
          t.nombre,
          t.tiene_descuento ? `${t.precio} BS → ${precioFinal} BS (Ahorro: ${(t.precio - precioFinal)}) BS` : `${precioFinal} BS`
        ];
      });

      autoTable(doc, {
        startY: y,
        head: [['Nombre', 'Precio Final']],
        body: treatmentsData,
        theme: 'grid',
        styles: { fontSize: 11 },
        margin: { left: 15, right: 15 },
      });
      y = (doc as any).lastAutoTable.finalY + 10;

      // Detallar subtotal de tratamientos
      doc.setFontSize(12);
      doc.text(`Subtotal Tratamientos: ${totalTreatments} BS`, 15, y);
      y += 10;
    } else {
      doc.setFontSize(12);
      doc.text('Sin tratamientos registrados.', 15, y);
      y += 10;
    }

    doc.setFontSize(14);
    doc.text('Otros Tratamientos:', 15, y);
    y += 5;

    let totalOtherTreatments: number = 0;
    if (payment.other_treatments && payment.other_treatments.length > 0) {
      const othersData = payment.other_treatments.map(o => {
        const price = Number(o.price) || 0;
        totalOtherTreatments += price;
        return [o.name, `${price} BS`];
      });

      autoTable(doc, {
        startY: y,
        head: [['Nombre', 'Precio']],
        body: othersData,
        theme: 'grid',
        styles: { fontSize: 11 },
        margin: { left: 15, right: 15 },
      });
      y = (doc as any).lastAutoTable.finalY + 10;

      // Detallar subtotal de otros tratamientos
      doc.setFontSize(12);
      doc.text(`Subtotal Otros Tratamientos: ${totalOtherTreatments} BS`, 15, y);
      y += 10;
    } else {
      doc.setFontSize(12);
      doc.text('Sin otros tratamientos.', 15, y);
      y += 10;
    }

    doc.setFontSize(14);
    doc.text('Resumen del Pago:', 15, y);
    y += 5;

    autoTable(doc, {
      startY: y,
      body: [
        ['Fecha de Pago', payment.date ? new Date(payment.date).toLocaleDateString() : 'No especificada'],
        ['Método', payment.method],
        ['Subtotal Tratamientos', `${totalTreatments} BS`],
        ['Subtotal Otros Tratamientos', `${totalOtherTreatments} BS`],
        ['Monto Total', `${payment.amount} BS`],
      ],
      theme: 'plain',
      styles: { fontSize: 12, halign: 'left' },
      margin: { left: 15, right: 15 },
    });

    y = (doc as any).lastAutoTable.finalY + 20;
    doc.setLineWidth(0.3);
    doc.line(60, y, 150, y);
    doc.text('Firma del Responsable', 90, y + 10);

    const filename = `comprobante_pago_${payment.id}_${payment.patient?.name || 'paciente'}.pdf`;
    doc.save(filename);
  }
}

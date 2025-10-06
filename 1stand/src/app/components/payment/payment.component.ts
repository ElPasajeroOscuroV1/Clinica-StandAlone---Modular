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
import { TreatmentService } from '../../services/treatment.service';
import { Treatment } from '../../services/treatment.service';
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

    // Cargar todos los datos iniciales de forma paralela
    forkJoin({
      payments: this.paymentService.getPayments(),
      patients: this.patientService.getPatients(),
      appointments: this.appointmentService.getAppointments(),
      treatments: this.treatmentService.getAll()
    }).subscribe({
      next: ({ payments, patients, appointments, treatments }) => {
        //console.log('Datos recibidos:', { payments, patients, appointments, treatments });
        console.log('Datos recibidos:');
        console.log('Pagos:', payments);
        console.log('Pacientes:', patients);
        console.log('Citas:', appointments);
        console.log('Tratamientos:', treatments);

        this.patients = patients;
        this.appointments = (appointments ?? []).filter(app => this.isAttendedAppointment(app));
        this.treatments = treatments;

        // Mapear pagos con tratamientos
        this.payments = payments.map((p: Payment): Payment => {
          const treatment = p.treatmentId ? this.treatments.find(t => t.id === p.treatmentId) : undefined;
          console.log(`Mapeando pago ID ${p.id}: treatmentId=${p.treatmentId}, treatment=`, treatment);
          return {
            ...p,
            treatment: treatment ? { id: treatment.id!, nombre: treatment.nombre } : undefined
          };
        });
      },
      error: (err) => console.error('Error cargando datos iniciales:', err)
    });

    // Suscripción a cambios en patient_id
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
        this.appointments = [];
        this.attentionTreatments = [];
        this.otherTreatments = [];
        this.selectedAttentionTotal = null;
        this.paymentForm.patchValue({ appointment_id: '' });
      }
    });

    // Suscripción a cambios en cita
    this.paymentForm.get('appointment_id')?.valueChanges.subscribe(appointmentId => {
      console.log('Cita seleccionada en Payment:', appointmentId);

      if (appointmentId) {
        this.loadMedicalAttentionByAppointment(Number(appointmentId));
      } else {
        this.applyAttentionData(null);
      }
    });
  }
  /*
  ngOnInit() {
    console.log('PaymentComponent initialized');

    // Cargar pagos
    this.paymentService.getPayments().subscribe({
      next: (data) => {
        console.log('Pagos recibidos:', data);
        //this.payments = data;
        this.payments = data.map(p => {
          const treatment = this.treatments.find(t => t.id === p.treatmentId);
          if (treatment) {
            // solo asigna treatment si existe y tiene id definido
            return { ...p, treatment: { id: treatment.id, nombre: treatment.nombre } };
          } else {
            return { ...p, treatment: undefined };
          }
        });
      },
      error: (err) => console.error('Error cargando pagos:', err)
    });

    // Cargar pacientes
    this.patientService.getPatients().subscribe({
      next: (data) => {
        console.log('Pacientes recibidos:', data);
        this.patients = data;
      },
      error: (err) => console.error('Error cargando pacientes:', err)
    });

    // Cargar citas
    this.appointmentService.getAppointments().subscribe({
      next: (data) => {
        console.log('Citas recibidas:', data);
        this.appointments = data;
      },
      error: (err) => console.error('Error cargando citas:', err)
    });

    // Carga tratamientos
    this.treatmentService.getAll().subscribe({
      next: (data) => {
        console.log('Tratamientos recibidos:', data);
        this.treatments = data;
      },
      error: (err) => console.error('Error cargando tratamientos:', err)
    });

    // Cuando cambia el paciente, actualizamos citas
    this.paymentForm.get('patient_id')?.valueChanges.subscribe(patientId => {
      console.log('Paciente seleccionado:', patientId);

      if (patientId) {
        this.appointmentService.getAppointmentsByPatient(patientId).subscribe({
          next: (data) => {
            console.log(`Citas del paciente ${patientId}:`, data);
            this.appointments = data;
          },
          error: (err) => console.error(`Error cargando citas para paciente ${patientId}:`, err)
        });
      } else {
        console.log('No se seleccionó paciente, limpiando citas');
        this.appointments = [];
        this.attentionTreatments = [];
        this.otherTreatments = [];
        this.selectedAttentionTotal = null;
        this.paymentForm.patchValue({ appointment_id: '' });
      }
    });
  }
*/
  private setFormValues(payment: Payment) {
    this.paymentForm.patchValue({
      patient_id: payment.patientId ?? payment.patient?.id ?? '',
      appointment_id: payment.appointmentId ?? payment.appointment?.id ?? '',
      amount: payment.amount,
      date: payment.date,
      method: payment.method
    });
  }


  editPayment(payment: Payment) {
    console.log('Editar pago:', payment);
    this.editingPaymentId = payment.id;

    // Cargar citas del paciente
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

        // Asegurarse de que el paciente est� en la lista
        const pacienteExiste = this.patients.some(p => p.id === payment.patientId);
        if (!pacienteExiste && payment.patient) {
          this.patients.push(payment.patient);
        }
        this.setFormValues(payment);
        this.loadMedicalAttentionByAppointment(payment.appointmentId, { forceAmount: false, forceTreatment: false });
        /*
        // Ahora sí, seteamos el formulario
        this.paymentForm.setValue({
          patient_id: payment.patientId,
          appointment_id: payment.appointmentId,
          treatment_id: payment.treatmentId ?? '',
          amount: payment.amount,
          date: payment.date,
          method: payment.method,
          status: payment.status
        });
        */
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
        status: this.editingPaymentId ? undefined : 'Pagado', // Para nuevo pago, set to 'Pagado'; para edit, backend maneja
      };

      if (this.editingPaymentId) {
        // 🔄 Actualizar pago existente
        this.paymentService.updatePayment(this.editingPaymentId, payload as any).subscribe({
          next: (updated: any) => {
            console.log('Pago actualizado:', updated);
            updated.amount = Number(updated.amount);
            this.payments = this.payments.map(p => p.id === updated.id ? updated : p);
            this.resetForm();
          },
          error: (err) => console.error('Error actualizando pago:', err)
        });
      } else {
        // 🆕 Crear nuevo pago
        this.paymentService.createPayment(payload).subscribe({
          next: (created: any) => {
            console.log('Pago creado:', created);
            created.amount = Number(created.amount);
            this.payments.push(created);
            this.resetForm();
          },
          error: (err) => console.error('Error creando pago:', err)
        });
      }
    } else {
      console.warn('Formulario inválido:', this.paymentForm.value);
    }
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
      console.warn('No se seleccion� una cita v�lida.');
      this.applyAttentionData(null, options);
      return;
    }

    this.medicalAttentionService.getMedicalAttentionByAppointment(appointmentId).subscribe({
      next: (attention: any) => {
        console.log('Atenci�n m�dica recibida:', attention);
        this.applyAttentionData(attention, options);
      },
      error: (err: any) => {
        console.error('Error al cargar la atenci�n m�dica:', err);
        this.applyAttentionData(null, options);
      }
    });
  }

  private applyAttentionData(attention: any | null, options: { forceAmount?: boolean, forceTreatment?: boolean } = {}): void {
    const { forceAmount = true, forceTreatment = true } = options;
    if (attention) {
      this.attentionTreatments = Array.isArray(attention.treatments) ? [...attention.treatments] : [];
      this.otherTreatments = Array.isArray(attention.other_treatments) ? [...attention.other_treatments] : [];
      const total = Number(attention.total_cost ?? 0);
      this.selectedAttentionTotal = total;
      const firstTreatmentId = this.attentionTreatments[0]?.id ?? '';
      const treatmentsList = this.attentionTreatments.map(t => `${t.nombre} - $${t.precio}`);
      const otherList = this.otherTreatments.map(ot => `${ot.name} - $${ot.price}`);
      this.treatmentsDisplay = [...treatmentsList, ...otherList].join(', ');

      if (forceAmount) {
        this.paymentForm.get('amount')?.setValue(total, { emitEvent: false });
      }
      if (forceTreatment) {
        this.paymentForm.get('treatment_id')?.setValue(firstTreatmentId, { emitEvent: false });
      }
      } else {
        this.attentionTreatments = [];
        this.otherTreatments = [];
        this.treatmentsDisplay = '';
        this.selectedAttentionTotal = null;
        if (forceAmount) {
          this.paymentForm.get('amount')?.setValue('', { emitEvent: false });
        }
        if (forceTreatment) {
          this.paymentForm.get('treatment_id')?.setValue('', { emitEvent: false });
        }
        }}
  private isAttendedAppointment(appointment: any): boolean {
    if (!appointment) {
      return false;
    }
    const status = (appointment.status ?? appointment.appointment_status ?? '').toString().toLowerCase();
    const payment_status = appointment.payment_status ?? 'Pendiente';
    return status === 'attended' && payment_status !== 'Pagado';
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

    // Encabezado
    doc.setFontSize(18);
    const logoBase64 = 'data:image/jpeg;base64,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';
    doc.addImage(logoBase64, 'JPEG', 15, 5, 20, 20);
    doc.text('COMPROBANTE DE PAGO', 70, 20);
    doc.setLineWidth(0.5);
    doc.line(15, 25, 195, 25);

    // Información general
    doc.setFontSize(12);
    doc.text(`Fecha de emisión: ${new Date().toLocaleDateString()}`, 15, 35);
    doc.text(`Paciente: ${payment.patient?.name || 'No especificado'}`, 15, 45);
    doc.text(`Cita: ${payment.appointment?.date ? new Date(payment.appointment.date).toLocaleDateString() : 'Sin fecha'}`, 15, 55);
    doc.text(`Médico: ${payment.appointment?.doctor_name || 'No registrado'}`, 15, 65);

    // Tratamientos principales
    let y = 80;
    doc.setFontSize(14);
    doc.text('Tratamientos Realizados:', 15, y);
    y += 5;

    if (payment.treatments && payment.treatments.length > 0) {
      autoTable(doc, {
        startY: y,
        head: [['Nombre', 'Precio (BS)']],
        body: payment.treatments.map(t => [t.nombre, t.precio]),
        theme: 'grid',
        styles: { fontSize: 11 },
        margin: { left: 15, right: 15 },
      });
      y = (doc as any).lastAutoTable.finalY + 10;
    } else {
      doc.setFontSize(12);
      doc.text('Sin tratamientos registrados.', 15, y);
      y += 10;
    }

    // Otros tratamientos
    doc.setFontSize(14);
    doc.text('Otros Tratamientos:', 15, y);
    y += 5;

    if (payment.other_treatments && payment.other_treatments.length > 0) {
      autoTable(doc, {
        startY: y,
        head: [['Nombre', 'Precio (BS)']],
        body: payment.other_treatments.map(o => [o.name, o.price]),
        theme: 'grid',
        styles: { fontSize: 11 },
        margin: { left: 15, right: 15 },
      });
      y = (doc as any).lastAutoTable.finalY + 10;
    } else {
      doc.setFontSize(12);
      doc.text('Sin otros tratamientos.', 15, y);
      y += 10;
    }

    // Totales
    doc.setFontSize(14);
    doc.text('Resumen del Pago:', 15, y);
    y += 5;

    autoTable(doc, {
      startY: y,
      body: [
        ['Fecha de Pago', payment.date ? new Date(payment.date).toLocaleDateString() : 'No especificada'],
        ['Método', payment.method],
        ['Monto Total', `${payment.amount} BS`],
      ],
      theme: 'plain',
      styles: { fontSize: 12, halign: 'left' },
      margin: { left: 15, right: 15 },
    });

    // Firma o pie
    y = (doc as any).lastAutoTable.finalY + 20;
    doc.setLineWidth(0.3);
    doc.line(60, y, 150, y);
    doc.text('Firma del Responsable', 90, y + 10);

    // Guardar archivo
    const filename = `comprobante_pago_${payment.id}_${payment.patient?.name || 'paciente'}.pdf`;
    doc.save(filename);
  }


}

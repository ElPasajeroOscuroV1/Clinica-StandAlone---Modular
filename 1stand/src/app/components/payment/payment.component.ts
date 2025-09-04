import { Component, OnInit } from '@angular/core';
import { PaymentService } from '../../services/payment.service';
import { Payment } from '../../interfaces/payment.interface';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { PatientService } from '../../services/patient.service';
import { AppointmentService } from '../../services/appointment.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  appointments: any[] = [];
  editingPaymentId: number | null = null;

  constructor(
    private paymentService: PaymentService,
    private patientService: PatientService,
    private appointmentService: AppointmentService
  ) {
    this.paymentForm = new FormGroup({
      patient_id: new FormControl('', [Validators.required]),
      appointment_id: new FormControl('', [Validators.required]),
      amount: new FormControl('', [Validators.required]),
      date: new FormControl('', [Validators.required]),
      method: new FormControl('Efectivo', [Validators.required]),
      status: new FormControl('Pendiente', [Validators.required]),
    });
  }

  ngOnInit() {
    console.log('PaymentComponent initialized');

    // Cargar pagos
    this.paymentService.getPayments().subscribe({
      next: (data) => {
        console.log('Pagos recibidos:', data);
        this.payments = data;
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
        this.paymentForm.patchValue({ appointment_id: '' });
      }
    });
  }
  private setFormValues(payment: Payment) {
    this.paymentForm.setValue({
      patient_id: payment.patientId ?? payment.patient?.id ?? '',
      appointment_id: payment.appointmentId ?? payment.appointment?.id ?? '',
      amount: payment.amount,
      date: payment.date,
      method: payment.method,
      status: payment.status
    });
  }

  editPayment(payment: Payment) {
    console.log('Editar pago:', payment);
    this.editingPaymentId = payment.id;

    // Cargar citas del paciente
    this.appointmentService.getAppointmentsByPatient(payment.patientId).subscribe({
      next: (appointments) => {
        this.appointments = appointments;

        // Asegurarse de que el paciente esté en la lista
        const pacienteExiste = this.patients.some(p => p.id === payment.patientId);
        if (!pacienteExiste && payment.patient) {
          this.patients.push(payment.patient);
        }

        // Ahora sí, seteamos el formulario
        this.paymentForm.setValue({
          patient_id: payment.patientId,
          appointment_id: payment.appointmentId,
          amount: payment.amount,
          date: payment.date,
          method: payment.method,
          status: payment.status
        });
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
      const payload = {
        patient_id: this.paymentForm.value.patient_id,
        appointment_id: this.paymentForm.value.appointment_id,
        amount: this.paymentForm.value.amount,
        date: this.paymentForm.value.date,
        method: this.paymentForm.value.method,
        status: this.paymentForm.value.status
      };

      if (this.editingPaymentId) {
        // 🔄 Actualizar pago existente
        this.paymentService.updatePayment(this.editingPaymentId, {
          patientId: payload.patient_id,
          appointmentId: payload.appointment_id,
          amount: payload.amount,
          date: payload.date,
          method: payload.method,
          status: payload.status,
          id: this.editingPaymentId
        }).subscribe({
          next: (updated) => {
            console.log('Pago actualizado:', updated);
            this.payments = this.payments.map(p => p.id === updated.id ? updated : p);
            this.resetForm();
          },
          error: (err) => console.error('Error actualizando pago:', err)
        });
      } else {
        // 🆕 Crear nuevo pago
        this.paymentService.createPayment(payload).subscribe({
          next: (created) => {
            console.log('Pago creado:', created);
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
      method: 'Efectivo',
      status: 'Pendiente'
    });
    this.editingPaymentId = null;
  }

  exportToPDF() {
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text('Lista de Pagos', 14, 20);

    const rows = this.payments.map(p => [
      p.id,
      p.patient?.name || '',
      p.appointment?.date || '',
      p.date,
      p.amount,
      p.method,
      p.status
    ]);

    autoTable(doc, {
      head: [['ID', 'Paciente', 'Fecha Cita', 'Fecha Pago', 'Monto', 'Método', 'Estado']],
      body: rows,
      startY: 30
    });

    doc.save('pagos.pdf');
  }

}

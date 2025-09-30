import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { MedicalHistoryModalComponent } from '../medical-history-modal/medical-history-modal.component';
import { MedicalHistoryService } from '../../services/medical-history.service';
import { MedicalAttentionService } from '../../services/medical-attention.service';
import { MedicalDataService } from '../../services/medical-data.service';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { MedicalHistory } from '../../interfaces/medical-history.interface';
import { Doctor } from '../../interfaces/doctor.interface';
/*
interface MedicalHistory {
  id: number;
  patient_id: number;
  consultation_reason: string;
  allergies: string;
  created_at: string;
  patient: {
    id: number;
    name: string;
    email: string;
    ci: string;
  };
}
*/
@Component({
  selector: 'app-medical-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './medical-history.component.html',
  styleUrls: ['./medical-history.component.css']
})
export class MedicalHistoryComponent implements OnInit {
  histories: MedicalHistory[] = [];
  doctors: Doctor[] = [];
  loading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  constructor(
    private historyService: MedicalHistoryService,
    private medicalAttentionService: MedicalAttentionService,
    private modalService: NgbModal,
    private medicalDataService: MedicalDataService
  ) {}

  ngOnInit(): void {
    this.loadDoctors();
    this.loadHistories();
  }

  loadDoctors(): void {
    this.medicalAttentionService.getDoctors().subscribe({
      next: (data: Doctor[]) => {
        this.doctors = data;
        console.log('Doctores cargados en medical-history:', this.doctors);
      },
      error: (err) => {
        console.error('Error al cargar doctores:', err);
      }
    });
  }

  loadHistories(): void {
    this.loading = true;
    this.errorMessage = null;
    this.successMessage = null;

    this.historyService.getAllMedicalHistories().subscribe({
      next: (res) => {
        this.histories = res.data; // 👈 ahora sí accedes al array
        this.loading = false;
        console.log('Historias clínicas cargadas:', this.histories);
      },
      error: (err) => {
        this.errorMessage = 'Error al cargar los historiales. Intenta de nuevo.';
        console.error('❌ Error cargando historiales:', err);
        this.loading = false;
      }
    });
  }



  openHistoryModal(history: MedicalHistory): void {
    const modalRef = this.modalService.open(MedicalHistoryModalComponent, { size: 'lg' });
    
    console.log('🔍 Abriendo modal desde medical-history para:', history);
    
    this.historyService.getAllMedicalHistories().subscribe({
      next: (res) => {
        const allHistories: MedicalHistory[] = res.data;
        const patientHistories = allHistories.filter(
          (h: MedicalHistory) => h.patient_id === history.patient_id
        );

        modalRef.componentInstance.patientId = history.patient.id;
        modalRef.componentInstance.patientHistories = patientHistories;
        modalRef.componentInstance.patientData = history.patient;
        
        // Asignar la historia seleccionada con todos sus datos
        modalRef.componentInstance.selectedHistory = {
          ...history,
          appointment_id: history.appointment_id || null,
          medical_attention_id: history.medical_attention_id || null
        };
        
        // Obtener información del doctor y appointment_id si hay medical_attention_id
        if (history.medical_attention_id) {
          console.log('🔍 Obteniendo información del doctor para medical_attention_id:', history.medical_attention_id);
          this.medicalAttentionService.getMedicalAttention(history.medical_attention_id).subscribe({
            next: (attention: any) => {
              console.log('📋 Atención médica obtenida:', attention);
              let doctorId: number | null = null;
              
              // Actualizar selectedHistory con el appointment_id correcto
              if (attention.appointment_id) {
                modalRef.componentInstance.selectedHistory = {
                  ...modalRef.componentInstance.selectedHistory,
                  appointment_id: attention.appointment_id
                };
                console.log('📅 Appointment ID actualizado en selectedHistory:', attention.appointment_id);
              }
              
              // Intentar obtener doctor_id de diferentes fuentes
              if (attention.appointment?.doctor_id) {
                doctorId = attention.appointment.doctor_id;
              } else if (attention.doctor_id) {
                doctorId = attention.doctor_id;
              }
              
              if (doctorId) {
                const doctor = this.doctors.find(d => d.id === doctorId);
                if (doctor) {
                  modalRef.componentInstance.doctorData = { id: doctor.id, name: doctor.name };
                  console.log('👨‍⚕️ Doctor asignado al modal:', doctor.name);
                }
              }
            },
            error: (err) => {
              console.error('❌ Error obteniendo información del doctor:', err);
            }
          });
        }
        
        // Forzar la carga de datos después de asignar selectedHistory
        setTimeout(() => {
          console.log('⏰ Forzando carga de datos desde medical-history');
          modalRef.componentInstance.loadSelectedHistory(modalRef.componentInstance.selectedHistory);
        }, 100);
      },
      error: (err) => {
        console.error('❌ Error cargando historiales para el modal:', err);
      }
    });

    modalRef.result.then((result) => {
      if (result === 'save' || result === 'update' || result?.action === 'update' || result?.action === 'create') {
        this.successMessage = 'Historial clínico actualizado correctamente.';
        this.loadHistories(); // Recarga la lista de historias
        this.medicalDataService.loadMedicalAttentions(); // Notifica al servicio que los datos han cambiado
        setTimeout(() => {
          this.successMessage = null;
        }, 3000);
      }
    }).catch(() => {});
  }


  exportHistoryToPDF(history: MedicalHistory): void {
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text(`Historia Clínica - ${history.patient.name}`, 20, 20);

    doc.setFontSize(12);
    doc.text(`ID: ${history.id}`, 20, 30);
    doc.text(`Paciente: ${history.patient.name}`, 20, 40);
    doc.text(`Cédula: ${history.patient.ci}`, 20, 50);
    doc.text(`Correo: ${history.patient.email}`, 20, 60);
    doc.text(`Motivo de consulta: ${history.consultation_reason}`, 20, 70);
    doc.text(`Alergias: ${history.allergies}`, 20, 80);
    doc.text(`Fecha de creación: ${history.created_at}`, 20, 90);

    doc.save(`HistoriaClinica_${history.patient.name}.pdf`);
  }

  exportHistoryHTMLToPDF(history: MedicalHistory): void {
    const element = document.createElement('div');
    element.innerHTML = `
      <h2>Historia Clínica - ${history.patient.name}</h2>
      <p><strong>ID:</strong> ${history.id}</p>
      <p><strong>Paciente:</strong> ${history.patient.name}</p>
      <p><strong>Cédula:</strong> ${history.patient.ci}</p>
      <p><strong>Correo:</strong> ${history.patient.email}</p>
      <p><strong>Motivo de consulta:</strong> ${history.consultation_reason}</p>
      <p><strong>Alergias:</strong> ${history.allergies}</p>
      <p><strong>Fecha de creación:</strong> ${history.created_at}</p>
    `;
    document.body.appendChild(element);

    html2canvas(element).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF();
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`HistoriaClinica_${history.patient.name}.pdf`);

      document.body.removeChild(element);
    });
  }


}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { MedicalHistoryModalComponent } from '../medical-history-modal/medical-history-modal.component';
import { MedicalHistoryService } from '../../services/medical-history.service';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { MedicalHistory } from '../../interfaces/medical-history.interface';
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
  loading = false;
  errorMessage: string | null = null;

  constructor(
    private historyService: MedicalHistoryService,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this.loadHistories();
  }

  loadHistories(): void {
    this.loading = true;
    this.errorMessage = null;

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
    
    this.historyService.getAllMedicalHistories().subscribe({
      next: (res) => {
        const allHistories: MedicalHistory[] = res.data; // 👈 ya tipado
        const patientHistories = allHistories.filter(
          (h: MedicalHistory) => h.patient_id === history.patient_id // 👈 ya no es any
        );

        modalRef.componentInstance.patientId = history.patient.id;
        modalRef.componentInstance.patientHistories = patientHistories;
        modalRef.componentInstance.selectedHistory = history;
        modalRef.componentInstance.patientData = history.patient;
        modalRef.componentInstance.applyHistory(history);
      },
      error: (err) => {
        console.error('❌ Error cargando historiales para el modal:', err);
      }
    });

    modalRef.result.then((result) => {
      if (result === 'save') {
        this.loadHistories();
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
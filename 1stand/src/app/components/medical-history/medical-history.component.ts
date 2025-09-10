import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { MedicalHistoryModalComponent } from '../medical-history-modal/medical-history-modal.component';
import { MedicalHistoryService } from '../../services/medical-history.service';

// Definición de interfaz (ajusta según tu API)
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
  // Agrega otros campos según sea necesario
}

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
      next: (data) => {
        this.histories = data;
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
    modalRef.componentInstance.patientId = history.patient?.id;
    modalRef.componentInstance.patientData = history;

    modalRef.result.then((result) => {
      if (result === 'save') {
        this.loadHistories(); // Refresca la tabla tras guardar
      }
    }).catch(() => {});
  }
}
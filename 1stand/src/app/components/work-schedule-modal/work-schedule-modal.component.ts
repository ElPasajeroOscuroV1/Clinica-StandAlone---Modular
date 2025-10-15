import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WorkScheduleService } from '../../services/work-schedule.service';
import { WorkSchedule } from '../../interfaces/work-schedule.interface';

@Component({
  selector: 'app-work-schedule-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './work-schedule-modal.component.html',
  styleUrls: ['./work-schedule-modal.component.css']
})
export class WorkScheduleModalComponent {
  @Input() doctorId!: number;

  schedules: WorkSchedule[] = [];
  newSchedule: WorkSchedule = { doctor_id: 0, day_of_week: '', start_time: '', end_time: '' };
  isVisible = false;

  days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  constructor(private scheduleService: WorkScheduleService) {}

  /** ✅ Abre el modal, configura el doctor y carga los horarios */
  openModal(doctorId: number) {
    this.doctorId = doctorId;
    this.newSchedule.doctor_id = doctorId;
    this.isVisible = true;
    this.loadSchedules();
  }

  /** ✅ Cierra el modal */
  closeModal() {
    this.isVisible = false;
  }

  /** ✅ Carga los horarios desde el backend */
  loadSchedules() {
    if (!this.doctorId) return;
    this.scheduleService.getByDoctor(this.doctorId).subscribe((data: WorkSchedule[]) => {
      this.schedules = data;
    });
  }

  /** ✅ Agrega un nuevo turno laboral */
  addSchedule() {
    if (!this.newSchedule.day_of_week || !this.newSchedule.start_time || !this.newSchedule.end_time) return;

    this.newSchedule.doctor_id = this.doctorId;

    this.scheduleService.create(this.newSchedule).subscribe(() => {
      this.loadSchedules();
      this.newSchedule = { doctor_id: this.doctorId, day_of_week: '', start_time: '', end_time: '' };
    });
  }

  /** ✅ Elimina un horario laboral */
  deleteSchedule(id: number) {
    if (confirm('¿Eliminar este turno?')) {
      this.scheduleService.delete(id).subscribe(() => this.loadSchedules());
    }
  }
}

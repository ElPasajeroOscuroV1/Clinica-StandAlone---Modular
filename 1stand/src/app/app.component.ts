import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DoctorService } from './services/doctor.service'; // Asegúrate de importar tu servicio
import { NgbModule } from '@ng-bootstrap/ng-bootstrap'; // Agrega esta línea

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NgbModule], // Agrega HttpClientModule
  providers: [DoctorService], // Provee el servicio aquí
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = '1stand';
}

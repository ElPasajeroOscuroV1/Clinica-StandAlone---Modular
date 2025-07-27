import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FacialCaptureComponent } from './components/facial-capture/facial-capture.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, FacialCaptureComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'mobile-app';
}
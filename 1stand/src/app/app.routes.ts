import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { HomeComponent } from './components/home/home.component';
import { RegisterComponent } from './components/register/register.component';
import { AppointmentComponent } from './components/appointment/appointment.component';
import { AuthGuard } from './guards/auth.guard';
import { DoctorComponent } from './components/doctor/doctor.component';
import { PatientComponent } from './components/patient/patient.component';

export const routes: Routes = [
    { path: '', redirectTo: '/login',
    pathMatch: 'full'
    },
    { path: 'login', component:
        LoginComponent
    },
    { path: 'home', component:
        HomeComponent
    },
    { path: 'register', component:
         RegisterComponent 
    },

    { 
        path: 'appointment',
        component: AppointmentComponent,
        canActivate: [AuthGuard]  // Aquí agregamos el guard 
    },

    { path: 'doctor', 
        component: DoctorComponent
        //canActivate: [AuthGuard]
    },

    { path: 'patient', 
        component: PatientComponent
        //canActivate: [AuthGuard] 
    },
    //{ path: '', redirectTo: '/doctor', pathMatch: 'full' }, // Redirige a /doctor por defecto
    //{ path: '**', redirectTo: '/doctor' }, // Maneja rutas no encontradas
    { path: '**', redirectTo: '/login' } // Redirige a login para rutas no encontradas
    
];

import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { HomeComponent } from './components/home/home.component';
import { RegisterComponent } from './components/register/register.component';
import { AppointmentComponent } from './components/appointment/appointment.component';
import { AuthGuard } from './guards/auth.guard';
import { DoctorComponent } from './components/doctor/doctor.component';
import { PatientComponent } from './components/patient/patient.component';
import { PaymentComponent } from './components/payment/payment.component';
import { TreatmentComponent } from './components/treatment/treatment.component';
import { MedicalAttentionComponent } from './components/medical-attention/medical-attention.component';
import { MedicalHistoryComponent } from './components/medical-history/medical-history.component';
import { ReportsComponent } from './components/reports/reports.component';

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

    { path: 'payment',
        component: PaymentComponent 
    },
    { path: 'treatment', 
        component: TreatmentComponent 
    },
    { path: 'medical-attention',
        component: MedicalAttentionComponent
    },
    { path: 'medical-history',
        component: MedicalHistoryComponent
    },
    { path: 'reports',
        component: ReportsComponent
    },
    /*
    { path: 'treatments', 
        loadComponent: () => import('./components/treatment/treatment.component')
        .then(m => m.TreatmentComponent),
        //canActivate: [AuthGuard]   // 👈 proteger con el guard
 
    },
    */
    //{ path: '', redirectTo: '/doctor', pathMatch: 'full' }, // Redirige a /doctor por defecto
    //{ path: '**', redirectTo: '/doctor' }, // Maneja rutas no encontradas
    { path: '**', redirectTo: '/login' } // Redirige a login para rutas no encontradas

    
];

import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { HomeComponent } from './components/home/home.component';
import { RegisterComponent } from './components/register/register.component';
import { AppointmentComponent } from './components/appointment/appointment.component';
import { AuthGuard } from './guards/auth.guard';

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

    { path: 'register', component: RegisterComponent },
    { 
        path: 'appointment',
        component: AppointmentComponent,
        canActivate: [AuthGuard]  // Aquí agregamos el guard 
    }
];

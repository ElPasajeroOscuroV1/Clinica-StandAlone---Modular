import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Chart, ChartConfiguration, ChartOptions, registerables } from 'chart.js';
import { FormsModule } from '@angular/forms';

// Register Chart.js components
Chart.register(...registerables);

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css']
})
export class ReportsComponent implements OnInit, AfterViewInit {

  @ViewChild('appointmentsChart', { static: true }) appointmentsChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('topPatientsChart', { static: true }) topPatientsChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('topTreatmentsChart', { static: true }) topTreatmentsChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('doctorStatsChart', { static: true }) doctorStatsChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('paymentsChart', { static: true }) paymentsChartRef!: ElementRef<HTMLCanvasElement>;

  appointmentsChart: Chart | null = null;
  topPatientsChart: Chart | null = null;
  topTreatmentsChart: Chart | null = null;
  doctorStatsChart: Chart | null = null;
  paymentsChart: Chart | null = null;

  // 📅 Filtros
  from: string = '';
  to: string = '';
  group: string = 'day';

  // 📊 Datos crudos de la API
  appointments: any[] = [];
  topPatients: any[] = [];
  topTreatments: any[] = [];
  doctorStats: any[] = [];
  payments: any[] = [];

  // 📈 Configuración de gráficos (para Chart.js)
  appointmentsChartData: ChartConfiguration<'bar'>['data'] = { labels: [], datasets: [] };
  topPatientsChartData: ChartConfiguration<'bar'>['data'] = { labels: [], datasets: [] };
  topTreatmentsChartData: ChartConfiguration<'bar'>['data'] = { labels: [], datasets: [] };
  doctorStatsChartData: ChartConfiguration<'bar'>['data'] = { labels: [], datasets: [] };
  paymentsChartData: ChartConfiguration<'bar'>['data'] = { labels: [], datasets: [] };

  chartOptions: ChartOptions = {
    responsive: true,
    plugins: {
      legend: { display: true, position: 'top' },
      tooltip: { enabled: true }
    }
  };

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadReports();
  }

  ngAfterViewInit(): void {
    this.createCharts();
  }

  createCharts(): void {
    // Crear gráfico de atenciones
    if (this.appointmentsChartRef) {
      this.appointmentsChart = new Chart(this.appointmentsChartRef.nativeElement, {
        type: 'bar',
        data: this.appointmentsChartData,
        options: this.chartOptions
      });
    }

    // Crear gráfico de pacientes frecuentes
    if (this.topPatientsChartRef) {
      this.topPatientsChart = new Chart(this.topPatientsChartRef.nativeElement, {
        type: 'bar',
        data: this.topPatientsChartData,
        options: this.chartOptions
      });
    }

    // Crear gráfico de tratamientos
    if (this.topTreatmentsChartRef) {
      this.topTreatmentsChart = new Chart(this.topTreatmentsChartRef.nativeElement, {
        type: 'bar',
        data: this.topTreatmentsChartData,
        options: this.chartOptions
      });
    }

    // Crear gráfico de estadísticas por doctor
    if (this.doctorStatsChartRef) {
      this.doctorStatsChart = new Chart(this.doctorStatsChartRef.nativeElement, {
        type: 'bar',
        data: this.doctorStatsChartData,
        options: this.chartOptions
      });
    }

    // Crear gráfico de pagos
    if (this.paymentsChartRef) {
      this.paymentsChart = new Chart(this.paymentsChartRef.nativeElement, {
        type: 'bar',
        data: this.paymentsChartData,
        options: this.chartOptions
      });
    }
  }

  updateCharts(): void {
    if (this.appointmentsChart) {
      this.appointmentsChart.data = this.appointmentsChartData;
      this.appointmentsChart.update();
    }
    if (this.topPatientsChart) {
      this.topPatientsChart.data = this.topPatientsChartData;
      this.topPatientsChart.update();
    }
    if (this.topTreatmentsChart) {
      this.topTreatmentsChart.data = this.topTreatmentsChartData;
      this.topTreatmentsChart.update();
    }
    if (this.doctorStatsChart) {
      this.doctorStatsChart.data = this.doctorStatsChartData;
      this.doctorStatsChart.update();
    }
    if (this.paymentsChart) {
      this.paymentsChart.data = this.paymentsChartData;
      this.paymentsChart.update();
    }
  }

  // 🔄 Cargar los reportes
  loadReports(): void {
    const baseUrl = 'http://localhost:8000/api/reports';

    // 1️⃣ Reporte de citas (appointments)
    this.http.get<any[]>(`${baseUrl}/appointments?from=${this.from}&to=${this.to}&group=${this.group}`)
      .subscribe(data => {
        this.appointments = data;
        this.appointmentsChartData = {
          labels: data.map(a => a.period),
          datasets: [
            { data: data.map(a => a.total), label: 'Atenciones', backgroundColor: '#3182ce' }
          ]
        };
        this.updateCharts();
      });

    // 2️⃣ Reporte de pacientes más frecuentes
    this.http.get<any[]>(`${baseUrl}/patients`)
      .subscribe(data => {
        this.topPatients = data;
        this.topPatientsChartData = {
          labels: data.map(p => p.patient),
          datasets: [
            { data: data.map(p => p.total), label: 'Pacientes', backgroundColor: '#48bb78' }
          ]
        };
        this.updateCharts();
      });

    // 3️⃣ Reporte de tratamientos más realizados
    this.http.get<any[]>(`${baseUrl}/treatments`)
      .subscribe(data => {
        this.topTreatments = data;
        this.topTreatmentsChartData = {
          labels: data.map(t => t.treatment || 'Sin tratamientos'),
          datasets: [
            { data: data.map(t => t.total || 0), label: 'Tratamientos', backgroundColor: '#ed8936' }
          ]
        };
        this.updateCharts();
      });

    // 4️⃣ Reporte de estadísticas por doctor
    this.http.get<any[]>(`${baseUrl}/doctors`)
      .subscribe(data => {
        this.doctorStats = data;
        this.doctorStatsChartData = {
          labels: data.map(d => d.doctor),
          datasets: [
            { data: data.map(d => d.total), label: 'Atenciones', backgroundColor: '#805ad5' }
          ]
        };
        this.updateCharts();
      });

    // 5️⃣ Reporte de pagos por periodo
    this.http.get<any[]>(`${baseUrl}/payments?from=${this.from}&to=${this.to}&group=${this.group}`)
      .subscribe(data => {
        this.payments = data;
        this.paymentsChartData = {
          labels: data.map(p => p.period),
          datasets: [
            { data: data.map(p => parseFloat(p.total || 0)), label: 'Pagos', backgroundColor: '#e53e3e' }
          ]
        };
        this.updateCharts();
      });
  }
}

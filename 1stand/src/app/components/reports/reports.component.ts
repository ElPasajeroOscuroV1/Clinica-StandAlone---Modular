import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Chart, ChartConfiguration, ChartOptions, ChartType, registerables } from 'chart.js';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CurrencyPipe } from '@angular/common';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

Chart.register(...registerables);

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [FormsModule, CommonModule, CurrencyPipe],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css']
})
export class ReportsComponent implements OnInit, AfterViewInit {

  @ViewChild('chartContainer', { static: false }) chartContainer!: ElementRef;

  from: string = '';
  to: string = '';
  group: string = 'month';

  appointments: any[] = [];
  topPatients: any[] = [];
  topTreatments: any[] = [];
  doctorStats: any[] = [];
  payments: any[] = [];
  summary: any = {};

  charts: Chart[] = [];

  appointmentsChartData: any;
  topPatientsChartData: any;
  topTreatmentsChartData: any;
  doctorStatsChartData: any;
  paymentsChartData: any;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    const today = new Date();
    this.to = today.toISOString().split('T')[0];
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    this.from = firstDay.toISOString().split('T')[0];

    this.loadReports();
  }

  ngAfterViewInit(): void {
    this.updateCharts();
  }

  loadReports(): void {
    const baseUrl = 'http://localhost:8000/api/reports';

    // 🟢 Resumen general
    this.http.get<any>(`${baseUrl}/summary`).subscribe(data => {
      this.summary = data;
    });

    // 🟢 Reporte de citas
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

    // 🟢 Pacientes más frecuentes
    this.http.get<any[]>(`${baseUrl}/top-patients`)
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

    // 🟢 Tratamientos más realizados
    this.http.get<any[]>(`${baseUrl}/top-treatments`)
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

    // 🟢 Estadísticas por doctor
    this.http.get<any[]>(`${baseUrl}/doctor-stats`)
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

    // 🟢 Pagos por periodo
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

  updateCharts(): void {
    this.destroyCharts();

    const chartConfigs: { elementId: string; data: any; type: ChartType; label: string }[] = [
      { elementId: 'appointmentsChart', data: this.appointmentsChartData, type: 'bar', label: 'Citas' },
      { elementId: 'patientsChart', data: this.topPatientsChartData, type: 'bar', label: 'Pacientes' },
      { elementId: 'treatmentsChart', data: this.topTreatmentsChartData, type: 'bar', label: 'Tratamientos' },
      { elementId: 'doctorStatsChart', data: this.doctorStatsChartData, type: 'bar', label: 'Doctores' },
      { elementId: 'paymentsChart', data: this.paymentsChartData, type: 'bar', label: 'Pagos' },
    ];

    chartConfigs.forEach(config => {
      const element = document.getElementById(config.elementId) as HTMLCanvasElement;
      if (element && config.data) {
        const chart = new Chart(element, {
          type: config.type,
          data: config.data,
          options: {
            responsive: true,
            plugins: { legend: { display: true, position: 'bottom' } }
          } as ChartOptions
        });
        this.charts.push(chart);
      }
    });
  }

  destroyCharts(): void {
    this.charts.forEach(chart => chart.destroy());
    this.charts = [];
  }

  exportPDF(): void {
    const data = document.getElementById('reportContent');
    if (data) {
      html2canvas(data, { scale: 2 }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        
        // Escalar la imagen para que quepa dentro de la página
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pageWidth - 20; // margen de 10mm a cada lado
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        
        // Si la altura es mayor que la página, reducimos un poco
        const finalHeight = pdfHeight > pageHeight - 20 ? pageHeight - 20 : pdfHeight;
        
        pdf.addImage(imgData, 'PNG', 10, 10, pdfWidth, finalHeight);
        pdf.save('reporte_completo.pdf');
      });
    }
  }

}

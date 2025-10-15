import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkScheduleModalComponent } from './work-schedule-modal.component';

describe('WorkScheduleModalComponent', () => {
  let component: WorkScheduleModalComponent;
  let fixture: ComponentFixture<WorkScheduleModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkScheduleModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WorkScheduleModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

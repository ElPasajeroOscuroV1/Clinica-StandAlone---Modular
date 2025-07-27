import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FacialCaptureComponent } from './facial-capture.component';

describe('FacialCaptureComponent', () => {
  let component: FacialCaptureComponent;
  let fixture: ComponentFixture<FacialCaptureComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FacialCaptureComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FacialCaptureComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

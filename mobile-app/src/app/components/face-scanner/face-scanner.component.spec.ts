import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FaceScannerComponent } from './face-scanner.component';

describe('FaceScannerComponent', () => {
  let component: FaceScannerComponent;
  let fixture: ComponentFixture<FaceScannerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FaceScannerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FaceScannerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

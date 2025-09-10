import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MedicalAttentionComponent } from './medical-attention.component';

describe('MedicalAttentionComponent', () => {
  let component: MedicalAttentionComponent;
  let fixture: ComponentFixture<MedicalAttentionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MedicalAttentionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MedicalAttentionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

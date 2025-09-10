import { TestBed } from '@angular/core/testing';

import { MedicalAttentionService } from './medical-attention.service';

describe('MedicalAttentionService', () => {
  let service: MedicalAttentionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MedicalAttentionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

import { TestBed } from '@angular/core/testing';

import { EvaluacionesAsignadasService } from './evaluaciones-asignadas.service';

describe('EvaluacionesAsignadasService', () => {
  let service: EvaluacionesAsignadasService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EvaluacionesAsignadasService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

import { TestBed } from '@angular/core/testing';

import { PreguntasEspecialesService } from './preguntas-especiales.service';

describe('PreguntasEspecialesService', () => {
  let service: PreguntasEspecialesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PreguntasEspecialesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

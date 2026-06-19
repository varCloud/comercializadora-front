import { TestBed } from '@angular/core/testing';

import { AnswerEvaluacionService } from './answer-evaluacion.service';

describe('AnswerEvaluacionService', () => {
  let service: AnswerEvaluacionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AnswerEvaluacionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

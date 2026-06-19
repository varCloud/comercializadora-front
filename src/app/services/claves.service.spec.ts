import { TestBed } from '@angular/core/testing';

import { ClavesService } from './claves.service';

describe('ClavesService', () => {
  let service: ClavesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ClavesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

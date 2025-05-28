import { TestBed } from '@angular/core/testing';

import { NiveauPoubelleService } from './niveau-poubelle.service';

describe('NiveauPoubelleService', () => {
  let service: NiveauPoubelleService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NiveauPoubelleService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

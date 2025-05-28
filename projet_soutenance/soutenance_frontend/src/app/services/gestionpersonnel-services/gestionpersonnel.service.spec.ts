import { TestBed } from '@angular/core/testing';

import { GestionpersonnelService } from './gestionpersonnel.service';

describe('GestionpersonnelService', () => {
  let service: GestionpersonnelService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GestionpersonnelService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

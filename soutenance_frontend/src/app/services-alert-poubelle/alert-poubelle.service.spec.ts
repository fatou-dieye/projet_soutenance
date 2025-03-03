import { TestBed } from '@angular/core/testing';

import { AlertPoubelleService } from './alert-poubelle.service';

describe('AlertPoubelleService', () => {
  let service: AlertPoubelleService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AlertPoubelleService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

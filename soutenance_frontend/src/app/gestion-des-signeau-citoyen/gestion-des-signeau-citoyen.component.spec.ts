import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionDesSigneauCitoyenComponent } from './gestion-des-signeau-citoyen.component';

describe('GestionDesSigneauCitoyenComponent', () => {
  let component: GestionDesSigneauCitoyenComponent;
  let fixture: ComponentFixture<GestionDesSigneauCitoyenComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionDesSigneauCitoyenComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestionDesSigneauCitoyenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

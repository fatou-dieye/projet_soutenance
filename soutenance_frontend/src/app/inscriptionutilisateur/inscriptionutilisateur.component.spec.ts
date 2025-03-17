import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InscriptionutilisateurComponent } from './inscriptionutilisateur.component';

describe('InscriptionutilisateurComponent', () => {
  let component: InscriptionutilisateurComponent;
  let fixture: ComponentFixture<InscriptionutilisateurComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InscriptionutilisateurComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InscriptionutilisateurComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

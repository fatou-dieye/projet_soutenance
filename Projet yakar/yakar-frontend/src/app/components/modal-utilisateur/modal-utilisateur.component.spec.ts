import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalUtilisateurComponent } from './modal-utilisateur.component';

describe('ModalUtilisateurComponent', () => {
  let component: ModalUtilisateurComponent;
  let fixture: ComponentFixture<ModalUtilisateurComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalUtilisateurComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalUtilisateurComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

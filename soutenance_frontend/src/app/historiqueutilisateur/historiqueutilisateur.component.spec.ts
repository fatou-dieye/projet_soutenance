import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HistoriqueutilisateurComponent } from './historiqueutilisateur.component';

describe('HistoriqueutilisateurComponent', () => {
  let component: HistoriqueutilisateurComponent;
  let fixture: ComponentFixture<HistoriqueutilisateurComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HistoriqueutilisateurComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HistoriqueutilisateurComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

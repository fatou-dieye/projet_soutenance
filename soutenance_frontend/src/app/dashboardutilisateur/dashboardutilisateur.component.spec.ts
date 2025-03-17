import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardutilisateurComponent } from './dashboardutilisateur.component';

describe('DashboardutilisateurComponent', () => {
  let component: DashboardutilisateurComponent;
  let fixture: ComponentFixture<DashboardutilisateurComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardutilisateurComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardutilisateurComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

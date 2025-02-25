import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionDesSignauxComponent } from './gestion-des-signaux.component';

describe('GestionDesSignauxComponent', () => {
  let component: GestionDesSignauxComponent;
  let fixture: ComponentFixture<GestionDesSignauxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionDesSignauxComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestionDesSignauxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

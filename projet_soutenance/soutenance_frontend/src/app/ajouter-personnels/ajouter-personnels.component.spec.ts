import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AjouterPersonnelsComponent } from './ajouter-personnels.component';

describe('AjouterPersonnelsComponent', () => {
  let component: AjouterPersonnelsComponent;
  let fixture: ComponentFixture<AjouterPersonnelsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AjouterPersonnelsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AjouterPersonnelsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

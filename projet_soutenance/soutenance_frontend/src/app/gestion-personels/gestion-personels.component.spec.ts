import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionPersonelsComponent } from './gestion-personels.component';

describe('GestionPersonelsComponent', () => {
  let component: GestionPersonelsComponent;
  let fixture: ComponentFixture<GestionPersonelsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionPersonelsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestionPersonelsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

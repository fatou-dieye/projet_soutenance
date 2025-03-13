import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AjouterPersonelsComponent } from './ajouter-personels.component';

describe('AjouterPersonelsComponent', () => {
  let component: AjouterPersonelsComponent;
  let fixture: ComponentFixture<AjouterPersonelsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AjouterPersonelsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AjouterPersonelsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

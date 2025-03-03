import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AlertePoubelleComponent } from './alerte-poubelle.component';

describe('AlertePoubelleComponent', () => {
  let component: AlertePoubelleComponent;
  let fixture: ComponentFixture<AlertePoubelleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AlertePoubelleComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AlertePoubelleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

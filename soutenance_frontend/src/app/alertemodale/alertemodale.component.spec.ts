import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AlertemodaleComponent } from './alertemodale.component';

describe('AlertemodaleComponent', () => {
  let component: AlertemodaleComponent;
  let fixture: ComponentFixture<AlertemodaleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AlertemodaleComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AlertemodaleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

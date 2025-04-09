import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MessageSuccesComponent } from './message-succes.component';

describe('MessageSuccesComponent', () => {
  let component: MessageSuccesComponent;
  let fixture: ComponentFixture<MessageSuccesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MessageSuccesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MessageSuccesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

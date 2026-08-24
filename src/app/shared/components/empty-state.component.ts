import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './empty-state.component.html',
  styleUrls: ['./empty-state.component.css']
})
export class EmptyStateComponent {
  @Input() title = '';
  @Input() description: string | undefined;
  @Input() iconSvg: string | undefined;
  @Input() actionLabel: string | undefined;
  @Output() actionCallback = new EventEmitter<void>();

  onAction(): void {
    this.actionCallback.emit();
  }
}

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IconComponent } from './icon.component';

@Component({
  selector: 'app-whatsapp-fab',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a
      href="https://wa.me/923007244198?text=Hello%20QistPY%2C%20I%20need%20help%20with%20installments."
      target="_blank"
      rel="noopener"
      aria-label="Chat on WhatsApp"
      class="group fixed bottom-5 left-5 z-50 flex items-center">
      <!-- Tooltip -->
      <span class="hidden md:block opacity-0 group-hover:opacity-100 transition-opacity
                   bg-ink text-white text-xs font-medium px-3 py-1.5 rounded-lg shadow-lg
                   absolute left-16 whitespace-nowrap pointer-events-none">
        Chat on WhatsApp
      </span>

      <!-- Button -->
      <span class="w-14 h-14 rounded-full bg-success text-white grid place-items-center
                   shadow-lg hover:scale-110 transition-transform relative">
        <!-- Pulse ring -->
        <span class="absolute inset-0 rounded-full bg-success animate-ping opacity-20"></span>
        <app-icon name="whatsapp" [size]="28" />
      </span>
    </a>
  `,
})
export class WhatsappFabComponent {}

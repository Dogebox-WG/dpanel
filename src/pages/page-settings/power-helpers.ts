import { areYouSure } from "/components/common/are-you-sure.js";
import { instruction } from "/components/common/instruction.js";
import { postHostShutdown } from "/api/system/post-host-shutdown.js";
import { postHostReboot } from "/api/system/post-host-reboot.js";

export function promptPowerOff() {
  areYouSure({
    title:'Are you sure you want to power off?',
    description:'Physical access may be required to turn your Dogebox on again',
    topButtonText: "Yes, power off",
    topButtonClick: onShutdown,
  })
}

export function promptReboot() {
  areYouSure({
    title:'Are you sure you want to reboot?',
    description:'Insert your recovery USB stick if you wish to enter recovery mode',
    topButtonText: "Yes, reboot now",
    topButtonClick: onReboot,
  })
}

function onShutdown() {
  instruction({
    img: '/static/img/bye.png',
    text: 'Dogebox turned off successfully.<br>You may close this page.',
    subtext: '',
  });
  setTimeout(() => {
    postHostShutdown()
  }, 500);
}

function onReboot() {
  // postHostReboot
  instruction({
    img: '/static/img/again.png',
    text: 'Rebooted.',
    subtext: 'Please re-reconnect to the same network as your Dogebox and refresh.',
  });
  setTimeout(() => {
    postHostReboot();
  }, 500)
}
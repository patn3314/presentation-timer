import { SettingsType } from '../App';
import './Settings.css';

interface Props {
  settings: SettingsType;
  setSettings: (s: SettingsType) => void;
  disabled: boolean;
}

export default function Settings({ settings, setSettings, disabled }: Props) {
  const handleChange = (key: keyof SettingsType) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = key === 'mode'
      ? e.target.value
      : Number(e.target.value);
    setSettings({ ...settings, [key]: value } as SettingsType);
  };

  return (
    <fieldset disabled={disabled}>
      <legend>Settings</legend>
      <label>
        Mode:
        <select value={settings.mode} onChange={handleChange('mode')}>
          <option value="countup">Count Up</option>
          <option value="countdown">Count Down</option>
        </select>
      </label>

      <label>
        Total (sec):
        <input type="number" value={settings.totalSec}
          onChange={handleChange('totalSec')} />
      </label>

      <label>
        1st Bell (sec):
        <input type="number" value={settings.bell1}
          onChange={handleChange('bell1')} />
      </label>

      <label>
        2nd Bell (sec):
        <input type="number" value={settings.bell2}
          onChange={handleChange('bell2')} />
      </label>

      <label>
        3rd Bell (sec):
        <input type="number" value={settings.bell3}
          onChange={handleChange('bell3')} />
      </label>
    </fieldset>
  );
}
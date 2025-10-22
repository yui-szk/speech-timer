import { ThemePicker, BellSoundPicker, ProgressModeToggle } from '../components'

const Settings = () => {
  return (
    <div className="space-y-4">
      <ThemePicker />
      <BellSoundPicker />
      <ProgressModeToggle />
    </div>
  );
};

export default Settings;
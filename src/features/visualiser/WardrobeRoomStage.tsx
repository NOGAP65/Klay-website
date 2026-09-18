import { useShallow } from 'zustand/react/shallow';

import { LoadingIndicator, space } from '@/ds';

import { usePhotoUpload } from './usePhotoUpload';
import { useVisualiserStore } from './useVisualiserStore';
import { WardrobeRoomPhoto } from './WardrobeRoomPhoto';

import './wardrobeRoom.css';

export default function WardrobeRoomStage({ onBack }: { onBack: () => void }) {
  const photo = usePhotoUpload();
  const selection = useVisualiserStore(useShallow(state => ({ modelId: state.wardrobeModel, colourName: state.wardrobeColour,
    widthMm: state.wardrobeWidthMm, handleFinish: state.wardrobeHandleFinish, recessed: state.wardrobeRecessed })));
  return <section className="wardrobe-room-stage" aria-label="Wardrobe in your room">
    <div className="wardrobe-room-actions">
      <button type="button" onClick={onBack}>Back to 3D preview</button>
      <button type="button" onClick={photo.handleUpload}>{photo.photoUrl ? 'Change room photo' : 'Upload room photo'}</button>
      <button type="button" onClick={photo.handleTakePhoto}>Take photo</button>
    </div>
    {photo.uploadError && <div role="alert" style={{ padding: space.item }}>{photo.uploadError}
      <button className="wardrobe-room-button" type="button" onClick={photo.retryPhoto}>Try again</button></div>}
    <div style={{ position: 'relative' }}>
      {photo.isLoadingPhoto && <LoadingIndicator overlay label="Loading room" />}
      {photo.photoUrl && photo.photoBitmap ? <WardrobeRoomPhoto key={`${photo.photoUrl}:${selection.recessed}`} photoUrl={photo.photoUrl}
        bitmap={photo.photoBitmap} selection={selection} /> : <div className="wardrobe-room-intro">
        <h2>See it in your room</h2><p>Start with a clear photo of your empty space, showing the floor and all four corners.</p>
        <p>Have its width, height and depth ready. The wardrobe stays at its actual size.</p>
      </div>}
    </div>
  </section>;
}

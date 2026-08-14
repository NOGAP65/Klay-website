// ---------------------------------------------------------------------------
// THE FOUR STEPS — one source, read by the homepage's gold bar and by the
// /how-it-works page.
//
// They used to live inside the homepage's How It Works section component, which
// was fine while that section was the only place they were stated. It is gone
// now: the homepage states the process as a 54px gold bar under the hero and
// sends anyone who wants the detail to /how-it-works, so the labels are shared
// data rather than one component's private array.
//
// THE PHOTOGRAPHS ARE THE POINT OF THIS FILE. They are the strongest assets in
// the repository — purpose-shot for these four beats, internally consistent down
// to the same technician appearing in step two and step four — and they were
// about to be deleted along with the homepage section that carried them. The
// /how-it-works page, which is the page actually about this process, had exactly
// one image on it: an empty blue room captioned "A Klay technician measuring a
// window". That was the wrong picture in the right place while the right picture
// sat in the wrong one.
// ---------------------------------------------------------------------------

export interface Step {
  /** Short form, for the gold bar. Fits on one line at 11px. */
  label: string
  /** One sentence, for the homepage bar's longer contexts and any summary use. */
  body: string
  image: string
  objectPosition: string
  /** Written out rather than derived from the label: these are photographs of
   * people doing work, and "We measure your space" is a step name, not a
   * description of what is in the frame. */
  alt: string
}

export const STEPS: Step[] = [
  {
    label: 'Design online',
    body: 'Choose fabric, colour, size and operation, and see it on your own window.',
    image: '/images/lifestyle/step-1-configure.png',
    objectPosition: 'center',
    alt: 'Configuring a blind on a laptop at a desk',
  },
  {
    label: 'We measure your space',
    body: 'A Klay technician comes to you and measures every window himself.',
    image: '/images/lifestyle/step-2-measure.png',
    objectPosition: 'center 42%',
    alt: 'A Klay technician measuring a window with a tape measure',
  },
  {
    label: 'Custom manufactured',
    body: 'Cut and assembled to your exact measurements in Australia, in 7–10 days.',
    image: '/images/lifestyle/step-3-manufacture.png',
    objectPosition: 'center',
    alt: 'Blind fabric being cut and finished on the factory floor',
  },
  {
    label: 'We install, you enjoy',
    body: 'The same technician returns to fit it and takes the packaging with him.',
    image: '/images/lifestyle/step-4-install.png',
    objectPosition: '38% center',
    alt: 'A Klay technician fitting a finished blind above a window',
  },
]

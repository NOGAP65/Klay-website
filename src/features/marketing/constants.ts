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
  /** ONE VERB, and the first word is the whole point.
   *
   * These were "Design online", "We measure your space", "Custom manufactured"
   * and "We install, you enjoy" — four different grammatical forms in four
   * steps: an imperative, a we-clause, a passive participle, and a compound of
   * the last two. Nielsen Norman's list-entry guidance is that entries have to
   * share one structure to be comparable at a glance, and four constructions is
   * the opposite of that; it is why the row read as four unrelated captions
   * rather than as one sequence.
   *
   * Worse, two of the four opened on the same word. NN/g measured that a scanning
   * reader takes in about TWO WORDS of a heading before deciding whether to read
   * on — front-loaded labels were understood 85% of the time from their first
   * eleven characters, and a label that opens on a filler word scored 0%. Steps
   * two and four both began "We", so half the row spent its entire scanned
   * budget on a pronoun that does not distinguish anything.
   *
   * Design / Measure / Make / Install: one verb each, four different first
   * letters, nothing spent before the distinguishing word. */
  label: string
  /** WHO DOES IT — the same slot in every step, which is what the four labels
   * gave up by carrying it inconsistently.
   *
   * It also happens to be the argument this section exists to make: the customer
   * does step one and Klay does the other three. That was buried inside two of
   * the old labels and absent from the other two. */
  actor: string
  /** One sentence. Shorter than it was on steps two and four, because `actor`
   * now carries the "a Klay technician comes to you" half of each and the
   * sentence no longer has to repeat it. */
  body: string
  /** THE ONE FACT THE STEP EARNS TRUST WITH — five or six words, for the
   * homepage marquee.
   *
   * The bar used to run the bare `label`s: DESIGN · MEASURE · MAKE · INSTALL.
   * Four nouns, and a reader finished the bar knowing exactly what they knew
   * before starting it, which is why it read as skippable furniture. Every
   * competitor bar in the category has the same problem from the other
   * direction — Wynstan runs five equal-weight badges, DIY Blinds four — and
   * badge soup is what happens when a strip carries claims with nothing
   * specific in them.
   *
   * So each step states the thing a customer does not already assume: that the
   * measure costs nothing, that it is made here and how fast, and that the man
   * who installs it is the man who measured it. `label` is still the ordering
   * mark; this is the reason to read past it.
   *
   * A PREPOSITIONAL PHRASE, lower case, no verb and no pronoun — because the
   * verb is already in `label` and this continues it. "DESIGN on your own
   * window", "MEASURE free, in your home". Four phrases of one shape, which is
   * the same discipline `label` is held to above and for the same reason.
   *
   * Written first as "See it on your own window" / "We come to you, free" /
   * "Made in Australia in 7–10 days" / "The same technician fits it": an
   * imperative, a we-clause, a passive and an article-clause. Four
   * constructions in four slots — exactly the fault that got the old labels
   * rewritten, reintroduced one field down.
   *
   * Distinct from `body`, which is a full sentence for the page and too long to
   * pass a moving strip. Same fact, marquee length. */
  promise: string
  image: string
  objectPosition: string
  /** Written out rather than derived from the label: these are photographs of
   * people doing work, and "We measure your space" is a step name, not a
   * description of what is in the frame. */
  alt: string
}

export const STEPS: Step[] = [
  {
    label: 'Design',
    actor: 'You, online',
    body: 'Choose fabric, colour, size and operation, and see it on your own window.',
    promise: 'on your own window',
    image: '/images/lifestyle/step-1-configure.png',
    objectPosition: 'center',
    alt: 'Configuring a blind on a laptop at a desk',
  },
  {
    label: 'Measure',
    actor: 'We come to you',
    body: 'A Klay technician measures every window himself. The visit is free.',
    promise: 'free, in your home',
    image: '/images/lifestyle/step-2-measure.png',
    objectPosition: 'center 42%',
    alt: 'A Klay technician measuring a window with a tape measure',
  },
  {
    label: 'Make',
    actor: 'Our workshop',
    body: 'Cut and assembled to your exact measurements in Australia, in 7–10 days.',
    promise: 'in Australia, in 7–10 days',
    image: '/images/lifestyle/step-3-manufacture.png',
    objectPosition: 'center',
    alt: 'Blind fabric being cut and finished on the factory floor',
  },
  {
    label: 'Install',
    actor: 'The same technician',
    body: 'He returns to fit it, and takes the packaging away with him.',
    promise: 'by the same technician',
    image: '/images/lifestyle/step-4-install.png',
    objectPosition: '38% center',
    alt: 'A Klay technician fitting a finished blind above a window',
  },
]

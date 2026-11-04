# Research notes: memory keepsakes (Nov 2026)

Desk research to sharpen what Pawsome Memories is for. Most sources are vendor pages and listings, so treat their claims as marketing; the grief research is the independent part.

## What we found

**1. Sound keepsakes are an established, growing category.**
Soundwave art (a recording's waveform engraved on glass, wood or canvas) with a QR code that plays the original audio is sold widely on Etsy and by specialist brands, positioned heavily around memorials ("families realise years later that the voice is gone"). Prices run roughly US$9 (digital file) to US$65+ (engraved/framed). Memorygram-style QR medallions and pet tags link to memorial pages with photos, video and voice.

**2. Nobody combines likeness + sound in one object.**
Figurine makers (ForeverPet from ~US$49; Indian 3D-print shops at roughly ₹2,000–6,000 for small figures) sell the *look*. Soundwave/QR sellers sell the *sound*. A hand-painted likeness whose base carries their real waveform, and that plays them when scanned, is our wedge.

**3. The biggest fear in this category is the link dying.**
Generic QR platforms are notorious for codes that stop working when a subscription lapses; memorial vendors now market "no subscription, no annual fee" and "lifetime hosting" as headline features. Buyers are told to check hosting terms, what happens if the company closes, and whether they can export their media.
→ We promise: **no subscription, ever; the code on the keepsake never expires; download everything at any time.**

**4. Hearing a loved one is comforting, not unhealthy.**
"Continuing bonds" grief research (Klass, Silverman & Nickman, 1996, and later work) treats ongoing connection with the deceased, including sensory experiences like hearing their voice, as meaningful rather than pathological. A longitudinal study in *Death Studies* (Aston University) found such experiences foster continuing bonds. Direct research on recordings/voicemails specifically is thin; claims that "voicemail listening improves grief outcomes" are commentary, not studies, so we don't make them.

**5. The insight we lead with:** people have thousands of photos of their pet and almost no recordings. Sounds are what fade first. (Stated as observation, not statistic.)

## What we changed because of it

- Every edition now includes **their real sound engraved as a waveform + a QR code** on the base.
- Homepage hero: visitors record or drop in a voice note and watch it **engrave onto a 3D keepsake live**, entirely on their device. The recording carries into the order wizard so they never record twice.
- Scanning the keepsake (`/q/<code>`) opens a **full-screen player**: their photo, their name, one tap to hear them while photos drift by, then their story. No app, no login.
- The QR code is **permanent and separate** from the private share link, so the owner can rotate their link without breaking the object in their home, and can pause scanning at any time.
- **Download everything** (zip of every photo, recording, video and their story) from the memory page.
- Studio gets a **vector engraving file** (name, waveform, QR in mm) per order for the production partner.

## Beyond pets: recommendation

The idea (a likeness to hold, a voice to hear again) applies directly to people: grandparents, parents, newborns, weddings. Two decisions to make before expanding:

1. **Brand architecture.** "Pawsome" is pet-specific. Recommended: keep *Pawsome Memories* as the pet line and launch people under a parent brand (working idea: *"… Memories"*, e.g. a neutral name that can hold both). Decide before printing packaging at scale. *(Business decision: not changed in code.)*
2. **Human figurines are a different craft and a different emotional register.** Likeness errors on a person hurt more than on a pet; memorial use is more frequent. Start with a sound-first product for people (waveform + QR keepsake, optional photo), add sculpted likeness once the artist pipeline is proven on Together Edition orders.

The data model already supports this: memory pages, sounds, QR codes and engraving don't assume an animal.

## Sources

- Beyond Memories: voice recording keepsakes and soundwave crystals: https://beyond-memories.com/blogs/beyond-memories/voice-recording-keepsake
- Memorygram medallions with voice: https://checkout.memorygram.com/pages/medallion-voice and pet medallions: https://checkout.memorygram.com/pages/medallions-for-pets
- Soundwave memorial listings: https://www.etsy.com/ch/shop/SoundWaveMemorials, https://www.custommade.com/personalized-soundwave-with-qr-code-framed-wood-si/by/schaferartstudio/
- QR subscription complaints: https://northpennnow.com/news/2026/apr/02/your-qr-code-stops-working-the-moment-you-stop-paying/, https://www.trustpilot.com/review/www.qr-code-generator.com?page=9
- No-subscription memorial QR positioning: https://myfarewelling.com/engraved-qr, https://myfarewelling.com/article/what-is-a-legacy-qr-code
- QR medallion privacy considerations: https://funeral.com/blogs/the-journal/qr-medallions-on-graves-how-digital-links-work-privacy-risks-and-cemetery-approval
- Continuing bonds / sensory experiences of the deceased (Death Studies, Aston University): https://publications.aston.ac.uk/id/eprint/47993/1/A_longitudinal_study_of_sensory_and_quasi-sensory_experiences_following_bereavement_using_interpretative_phenomenological_analysis.pdf
- Pet figurine pricing: https://www.startuphub.ai/startups/foreverpet.md, https://m.indiamart.com/ikix-my3dprints, https://getfiguro.com/blogs/figurine/3d-mini-me-pricing

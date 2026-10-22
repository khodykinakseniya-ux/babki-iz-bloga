// Only real assets and verified destination URLs belong here.
const assets = `${import.meta.env.BASE_URL}assets/`;
export const config = {
  paymentUrl: 'https://payform.ru/aecRmSc/',
  offerUrl: '',
  privacyUrl: '',
  businessDetails: '',
  photos: { nadezhda: `${assets}nadezhda.jpg`, evgenia: `${assets}evgenia-case.png` },
  reviews: [
    { src: `${assets}review-darya.jpg`, alt: 'Оригинальный отзыв Дарьи', width: 732, height: 1668 },
    { src: `${assets}review-anisya.jpg`, alt: 'Оригинальный скриншот отзыва Анисьи', width: 615, height: 1249 },
  ],
};

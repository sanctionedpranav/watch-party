/** Centered spinner with an optional message */
const Loader = ({ text = 'Loading...' }) => (
  <div className="loader">
    <span className="loader-spinner" aria-hidden="true" />
    <p>{text}</p>
  </div>
);

export default Loader;

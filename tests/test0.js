const {StyleSheet, css} = aphrodite;

const styles = StyleSheet.create({
  title: {
    fontSize: 64,
  },
  wrapper: {
    background: "darkBlue",
    color: "white",
  },
});

const title = <h1 className={css(styles.title)}>Hello, world</h1>;

<div className={css(styles.wrapper)}>
  {title}
</div>
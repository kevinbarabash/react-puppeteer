import Foo from "../components/foo.js";

const {StyleSheet, css} = aphrodite;

const styles = StyleSheet.create({
  wrapper: {
    background: "darkBlue",
    color: "white",
  },
});

<div className={css(styles.wrapper)}>
  <Foo/>
</div>
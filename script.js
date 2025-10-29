document.getElementById('quizForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const result = document.getElementById('result');
  result.innerText = 'Cảm ơn bạn đã tham gia! Kết quả sẽ được công bố sau!';
  this.reset();
});

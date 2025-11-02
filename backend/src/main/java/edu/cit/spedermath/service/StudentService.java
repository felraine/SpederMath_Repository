package edu.cit.spedermath.service;

import edu.cit.spedermath.model.Student;
import edu.cit.spedermath.model.Teacher;
import edu.cit.spedermath.repository.StudentRepository;
import edu.cit.spedermath.repository.TeacherRepository;
import edu.cit.spedermath.util.JwtUtil;
import edu.cit.spedermath.util.CryptoUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import org.springframework.transaction.annotation.Transactional;
import java.io.IOException;
import java.security.SecureRandom;
import java.time.LocalDate;
import java.util.*;

@Service
public class StudentService {

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private TeacherRepository teacherRepository;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private CryptoUtil cryptoUtil;

    private static final String CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    // --- Generate random password ---
    private String generateRandomPassword(int length) {
        SecureRandom random = new SecureRandom();
        StringBuilder password = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            int index = random.nextInt(CHARACTERS.length());
            password.append(CHARACTERS.charAt(index));
        }
        return password.toString();
    }

    // --- Create new student ---
    public Student createStudent(
            String fname,
            String lname,
            String username,
            LocalDate birthdate,
            MultipartFile profilePicture,
            Long teacherId
    ) throws IOException {

        Teacher teacher = teacherRepository.findById(teacherId)
                .orElseThrow(() -> new RuntimeException("Teacher not found."));

        if (studentRepository.findByUsername(username).isPresent()) {
            throw new RuntimeException("Student with this username already exists.");
        }

        String rawPassword = generateRandomPassword(8);
        String hashedPassword = cryptoUtil.encrypt(rawPassword);

        byte[] profilePictureBytes = null;
        if (profilePicture != null && !profilePicture.isEmpty()) {
            profilePictureBytes = profilePicture.getBytes();
        }

        Student student = new Student(
                fname,
                lname,
                username,
                hashedPassword,
                birthdate,
                LocalDate.now(),
                profilePictureBytes,
                teacher
        );

        Student saved = studentRepository.save(student);
        saved.setPassword(rawPassword);

        // You can return the raw password separately in your controller if needed
        return saved;
    }

    // --- Get student by username ---
    public Optional<Student> getStudentByUsername(String username) {
        return studentRepository.findByUsername(username);
    }

    // --- Get student by ID ---
    public Optional<Student> getStudentById(Long studentID) {
        return studentRepository.findById(studentID);
    }

    // --- Edit student ---
    public Student updateStudent(
            Long studentID,
            String fname,
            String lname,
            String username,
            MultipartFile profilePicture,
            Long teacherId
    ) throws IOException {

        Teacher teacher = teacherRepository.findById(teacherId)
                .orElseThrow(() -> new RuntimeException("Teacher not found."));

        Student student = studentRepository.findById(studentID)
                .orElseThrow(() -> new RuntimeException("Student not found."));

        Optional<Student> studentWithNewUsername = studentRepository.findByUsername(username);
        if (studentWithNewUsername.isPresent() &&
                !Objects.equals(studentWithNewUsername.get().getStudentID(), studentID)) {
            throw new RuntimeException("Username is already taken.");
        }

        student.setFName(fname);
        student.setLName(lname);
        student.setUsername(username);
        student.setTeacher(teacher);

        if (profilePicture != null && !profilePicture.isEmpty()) {
            student.setProfilePicture(profilePicture.getBytes());
        }

        return studentRepository.save(student);
    }

    // --- Delete student ---
    public void deleteStudent(Long studentID) {
        if (!studentRepository.existsById(studentID)) {
            throw new RuntimeException("Student not found.");
        }
        studentRepository.deleteById(studentID);
    }

    // --- Get all students ---
    public List<Student> getAllStudents() {
        List<Student> students = studentRepository.findAll();
        for (Student student : students) {
            try {
                String decrypted = cryptoUtil.decrypt(student.getPassword());
                student.setPassword(decrypted);
            } catch (Exception e) {
                student.setPassword("Decryption error");
            }
        }
        return students;
    }

    // --- Get all students by teacher ---
    @Transactional(readOnly = true)
    public List<Student> getStudentsByTeacher(Teacher teacher) {
        List<Student> students = studentRepository.findByTeacher(teacher);

        for (Student student : students) {
            try {
                String decrypted = cryptoUtil.decrypt(student.getPassword());
                student.setPassword(decrypted);
            } catch (Exception e) {
                student.setPassword("Decryption error");
            }
        }

        return students;
    }
    // --- Student login ---
    public Map<String, String> loginStudent(String username, String password) {
        Optional<Student> studentOptional = studentRepository.findByUsername(username);
        Map<String, String> response = new HashMap<>();

        if (studentOptional.isEmpty()) {
            response.put("error", "Invalid email or password!");
            return response;
        }

        Student student = studentOptional.get();

        // Decrypt the stored AES-GCM password and compare
        String decrypted;
        try {
            decrypted = cryptoUtil.decrypt(student.getPassword());
        } catch (Exception e) {
            // (Optional) If you STILL have legacy bcrypt accounts and want temporary compatibility,
            // you could fallback to bcrypt matches here. If you DON'T want bcrypt at all, keep it as error.
            response.put("error", "Invalid email or password!");
            return response;
        }

        if (!Objects.equals(decrypted, password)) {
            response.put("error", "Invalid email or password!");
            return response;
        }

        String token = jwtUtil.generateStudentToken(student.getStudentID());
        response.put("token", token);
        response.put("message", "Login successful!");
        return response;
    }

    // --- Admin password reset (optional) ---
    public Map<String, String> resetStudentPassword(Long studentId) {
        Student s = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found."));
        String raw = generateRandomPassword(8);
        s.setPassword(cryptoUtil.encrypt(raw));
        studentRepository.save(s);
        return Map.of(
                "message", "Password reset successfully!",
                "tempPassword", raw
        );
    }
}

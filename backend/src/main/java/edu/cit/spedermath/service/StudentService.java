package edu.cit.spedermath.service;

import edu.cit.spedermath.model.Teacher;
import edu.cit.spedermath.repository.TeacherRepository;
import edu.cit.spedermath.model.Student;
import edu.cit.spedermath.repository.StudentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import edu.cit.spedermath.util.JwtUtil;

import java.io.IOException;
import java.security.SecureRandom;
import java.time.LocalDate;
import java.util.Optional;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class StudentService {

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private TeacherRepository teacherRepository;

    @Autowired
    private JwtUtil jwtUtil;


    private static final String CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

    // Random pass generator
    private String generateRandomPassword() {
        SecureRandom random = new SecureRandom();
        StringBuilder password = new StringBuilder(8);
        boolean isUnique = false;
        int maxRetries = 10;
        int retries = 0;

        while (!isUnique && retries < maxRetries) {
            password = new StringBuilder(8);
            for (int i = 0; i < 8; i++) {
                int index = random.nextInt(CHARACTERS.length());
                password.append(CHARACTERS.charAt(index));
            }

            isUnique = !studentRepository.existsByPassword(password.toString());
            retries++;
        }

        if (retries == maxRetries) {
            throw new RuntimeException("Failed to generate a unique password after several attempts.");
        }

        return password.toString();
    }

    // Create new student
    public Student createStudent(String fname, String lname, String username, LocalDate birthdate, MultipartFile profilePicture, Long teacherId) throws IOException {
        Teacher teacher = teacherRepository.findById(teacherId)
            .orElseThrow(() -> new RuntimeException("Teacher not found."));
        int level = 1;
        Optional<Student> existingStudent = studentRepository.findByUsername(username);
        if (existingStudent.isPresent()) {
            throw new RuntimeException("Student with this username already exists.");
        }
    
        String generatedPassword = generateRandomPassword();
    
        // Convert the profile picture to byte array, if it exists
        byte[] profilePictureBytes = null;
        if (profilePicture != null) {
            profilePictureBytes = profilePicture.getBytes();
        }
    
        Student student = new Student(fname, lname, username, generatedPassword, birthdate, LocalDate.now(), level, profilePictureBytes, teacher);
        return studentRepository.save(student);
    }

    // Get student by username
    public Optional<Student> getStudentByUsername(String username) {
        return studentRepository.findByUsername(username);
    }

    // Get student by ID
    public Optional<Student> getStudentById(Long studentID) {
        return studentRepository.findById(studentID);
    }

    // Edit student
    public Student updateStudent(Long studentID, String fname, String lname, String username, Integer level, MultipartFile profilePicture, Long teacherId) throws IOException {
        Teacher teacher = teacherRepository.findById(teacherId)
        .orElseThrow(() -> new RuntimeException("Teacher not found."));

        Optional<Student> existingStudent = studentRepository.findById(studentID);
        if (!existingStudent.isPresent()) {
            throw new RuntimeException("Student not found.");
        }

        Optional<Student> studentWithNewUsername = studentRepository.findByUsername(username);
        if (studentWithNewUsername.isPresent() && !studentWithNewUsername.get().getStudentID().equals(studentID)) {
            throw new RuntimeException("Username is already taken.");
        }

        Student student = existingStudent.get();
        student.setFName(fname);
        student.setLName(lname);
        student.setUsername(username);
        student.setLevel(level);
        student.setTeacher(teacher);

        if (profilePicture != null) {
            student.setProfilePicture(profilePicture.getBytes());
        }

        return studentRepository.save(student);
    }

    // Delete student
    public void deleteStudent(Long studentID) {
        Optional<Student> existingStudent = studentRepository.findById(studentID);
        if (!existingStudent.isPresent()) {
            throw new RuntimeException("Student not found.");
        }

        studentRepository.deleteById(studentID);
    }

    // get all students
    public List<Student> getAllStudents() {
        return studentRepository.findAll();
    }

    public List<Student> getStudentsByTeacher(Teacher teacher) {
        return studentRepository.findByTeacher(teacher);
    }

    //student login
    public Map<String, String> loginStudent (String username, String password) {
        Optional<Student> studentOptional = studentRepository.findByUsername(username);
        Map<String, String> response = new HashMap<>();

        if (studentOptional.isEmpty()) {
            response.put("error", "Invalid email or password!");
            return response;
        }

        Student student = studentOptional.get();
        if (password.equals(student.getPassword())) {
            String token = jwtUtil.generateToken(student.getStudentID());
            response.put("token", token);
            response.put("message", "Login successful!");
            return response;
        } else {
            response.put("error", "Invalid email or password!");
            return response;
        }
    }
}
